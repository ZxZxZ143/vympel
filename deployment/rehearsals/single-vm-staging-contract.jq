.services as $services |
(
  [
    "postgres",
    "redis",
    "minio",
    "minio-init",
    "backend-logs-init",
    "migrate",
    "backend",
    "storefront",
    "crm",
    "media-gateway"
  ]
  | all(. as $name | $services[$name] != null)
) and
(
  [$services[] | has("build")]
  | all(. == false)
) and
(
  ($services.postgres.ports // [] | length == 0) and
  ($services.redis.ports // [] | length == 0) and
  ($services.minio.ports // [] | length == 0) and
  ($services.backend.ports == [{
    "mode": "ingress",
    "target": 8080,
    "published": "8080",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }]) and
  ($services.storefront.ports == [{
    "mode": "ingress",
    "target": 3000,
    "published": "3000",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }]) and
  ($services.crm.ports == [{
    "mode": "ingress",
    "target": 3001,
    "published": "3001",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }]) and
  ($services["media-gateway"].ports == [{
    "mode": "ingress",
    "target": 8080,
    "published": "9002",
    "host_ip": "127.0.0.1",
    "protocol": "tcp"
  }])
) and
(
  (.networks.application.internal == true) and
  (.networks.data.internal == true) and
  ($services.migrate.restart == "no") and
  ($services["minio-init"].restart == "no") and
  ($services["backend-logs-init"].restart == "no") and
  (
    ["postgres", "redis", "minio", "backend", "storefront", "crm", "media-gateway"]
    | all(. as $name | $services[$name].restart == "unless-stopped")
  )
) and
(
  ["postgres", "redis", "minio", "backend", "storefront", "crm", "media-gateway"]
  | all(. as $name | ($services[$name].healthcheck.test | length) > 0)
) and
(
  ($services.backend.depends_on.migrate.condition == "service_completed_successfully") and
  ($services.backend.depends_on.postgres.condition == "service_healthy") and
  ($services.backend.depends_on.redis.condition == "service_healthy") and
  ($services.backend.depends_on.minio.condition == "service_healthy") and
  ($services.storefront.depends_on.backend.condition == "service_healthy") and
  ($services.crm.depends_on.backend.condition == "service_healthy") and
  ($services.migrate.environment.SPRING_LIQUIBASE_ENABLED == "true") and
  ($services.migrate.environment.VYMPEL_MIGRATION_ONLY == "true") and
  ($services.migrate.environment.VYMPEL_BOOTSTRAP_ADMIN_ENABLED == "false") and
  ($services.migrate.restart == "no") and
  ($services.backend.environment.SPRING_LIQUIBASE_ENABLED == "false")
) and
(
  ($services.backend.environment.VYMPEL_DB_URL | contains("postgres:5432")) and
  ($services.backend.environment.VYMPEL_REDIS_URL | contains("redis:6379")) and
  ($services.backend.environment.VYMPEL_S3_ENDPOINT == "http://minio:9000") and
  ($services.backend.environment.VYMPEL_CMS_PUBLIC_REVALIDATE_URL == "http://storefront:3000/api/revalidate") and
  ($services.storefront.environment.BASE_API_PUBLIC == "http://backend:8080/api/public")
) and
(
  ($services.backend.image | test("^ghcr[.]io/zxzxz143/vympel-backend:[^:]+$")) and
  ($services.storefront.image | test("^ghcr[.]io/zxzxz143/vympel-storefront:[^:]+$")) and
  ($services.crm.image | test("^ghcr[.]io/zxzxz143/vympel-crm:[^:]+$")) and
  ([ $services.backend.image, $services.storefront.image, $services.crm.image ]
    | all(test(":latest$") | not))
) and
(
  (.volumes | has("postgres-data") and has("redis-data") and has("minio-data") and has("backend-logs")) and
  (
    [
      $services.postgres.volumes[].source,
      $services.redis.volumes[].source,
      $services.minio.volumes[].source,
      $services.backend.volumes[].source
    ]
    | contains(["postgres-data", "redis-data", "minio-data", "backend-logs"])
  )
) and
(
  (
    ["postgres", "redis", "minio", "backend", "storefront", "crm", "media-gateway"]
    | map($services[.].deploy.resources.limits.memory | tonumber)
    | add
  ) == 5704253440 and
  (
    ["postgres", "redis", "minio", "backend", "storefront", "crm", "media-gateway"]
    | map($services[.].deploy.resources.limits.cpus | tonumber)
    | add
  ) == 2 and
  ($services.backend.deploy.resources.limits.memory | tonumber) == 2147483648 and
  ($services.migrate.deploy.resources.limits.memory | tonumber) == 1610612736 and
  ($services.backend.environment.JAVA_TOOL_OPTIONS | contains("-XX:MaxRAMPercentage=60.0"))
) and
(
  [
    $services.storefront.environment,
    $services.crm.environment
  ]
  | map(keys[])
  | all(test("^NEXT_PUBLIC_.*(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|ACCESS_KEY)") | not)
)
