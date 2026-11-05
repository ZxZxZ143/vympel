"""Exercise the Dockerfile's actual bootstrap gate without downloading packages.

Usage: python deployment/rehearsals/backend-apt-security.py LOCAL_BACKEND_IMAGE
Requires Docker and an already built Jammy backend image. All containers are
network-isolated, read-only and disposable. The real dpkg validates versions.
"""

import pathlib
import subprocess
import sys


def main():
    image = sys.argv[1]
    root = pathlib.Path(__file__).resolve().parents[2]
    dockerfile = (root / "vympel_back/Dockerfile").read_text()
    runtime = dockerfile.split(" AS runtime\n", 1)[1]
    command = runtime.split("RUN ", 1)[1].split("    && rm -rf", 1)[0]
    command = command.replace("\\\n", " ").strip()
    # Intercept acquisition only. Run the exact installed-state/version guard
    # from the Dockerfile through the image's /bin/sh and real dpkg executable.
    harness = r'''
mkdir /tmp/bin
export PATH=/tmp/bin:$PATH
cat > /tmp/bin/apt-get <<'APT_MOCK'
#!/bin/sh
    printf '%s\n' "$*" >> /tmp/apt-calls
    case "$*" in
        '-o Acquire::Retries=0 update') exit "$UPDATE_EXIT" ;;
        '-o Acquire::Retries=0 install -y --no-install-recommends --only-upgrade apt libapt-pkg6.0') exit "$UPGRADE_EXIT" ;;
        'install -y --no-install-recommends curl libbrotli1 libssl3 openssl webp') echo DEPENDENCIES_REACHED ;;
        *) echo UNEXPECTED_APT_COMMAND; exit 98 ;;
    esac
APT_MOCK
cat > /tmp/bin/dpkg-query <<'QUERY_MOCK'
#!/bin/sh
    case "$3" in
        apt) version=$APT_VERSION; state=$APT_STATE; query_exit=$APT_QUERY_EXIT ;;
        libapt-pkg6.0) version=$LIBAPT_VERSION; state=$LIBAPT_STATE; query_exit=$LIBAPT_QUERY_EXIT ;;
        *) exit 97 ;;
    esac
    case "$2" in
        '-f=${db:Status-Status}') printf '%s' "$state" ;;
        '-f=${Version}') printf '%s' "$version" ;;
        *) exit 96 ;;
    esac
    exit "$query_exit"
QUERY_MOCK
chmod +x /tmp/bin/apt-get /tmp/bin/dpkg-query
'''
    fixed = "2.4.15ubuntu0.1"
    defaults = dict(APT_VERSION=fixed, LIBAPT_VERSION=fixed,
                    APT_STATE="installed", LIBAPT_STATE="installed",
                    APT_QUERY_EXIT="0", LIBAPT_QUERY_EXIT="0",
                    UPDATE_EXIT="0", UPGRADE_EXIT="0")
    cases = [("fixed floor", {}, True),
             ("newer versions", dict(APT_VERSION="2.4.15ubuntu0.2",
                                      LIBAPT_VERSION="2.4.15ubuntu0.2"), True),
             ("update failure", dict(UPDATE_EXIT="100"), False),
             ("upgrade failure", dict(UPGRADE_EXIT="100"), False)]
    for package in ("APT", "LIBAPT"):
        for name, suffix, value in (
            ("vulnerable version", "VERSION", "2.4.14"),
            ("pre-fix revision", "VERSION", "2.4.15"),
            ("empty version", "VERSION", ""),
            ("invalid version", "VERSION", "bad version"),
            ("warning-only version", "VERSION", "2.4.15ubuntu0.1_"),
            ("query failure with plausible output", "QUERY_EXIT", "1"),
            ("missing package", "STATE", ""),
            ("residual config", "STATE", "config-files"),
            ("unconfigured package", "STATE", "unpacked"),
        ):
            cases.append((package + " " + name, {package + "_" + suffix: value}, False))
    for name, overrides, expected in cases:
        args = ["docker", "run", "--rm", "--network", "none", "--read-only",
                "--tmpfs", "/tmp:exec", "--cap-drop", "ALL", "--security-opt",
                "no-new-privileges", "--entrypoint", "/bin/sh"]
        for key, value in (defaults | overrides).items():
            args += ["--env", key + "=" + value]
        result = subprocess.run(args + [image, "-c", harness + "\n" + command],
                                capture_output=True, text=True)
        reached = "DEPENDENCIES_REACHED" in result.stdout
        assert (result.returncode == 0) == expected and reached == expected, (
            name, result.returncode, result.stdout, result.stderr)
        assert "UNEXPECTED_APT_COMMAND" not in result.stdout, result.stdout
        print("PASS " + name, flush=True)
    print(f"PASS {len(cases)} bootstrap retry/version boundary cases")


if __name__ == "__main__":
    main()
