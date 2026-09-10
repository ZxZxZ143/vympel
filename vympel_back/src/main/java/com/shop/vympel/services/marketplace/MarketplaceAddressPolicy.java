package com.shop.vympel.services.marketplace;

import java.net.InetAddress;
import java.net.UnknownHostException;

/** Shared SSRF address policy for outbound marketplace importers. */
public final class MarketplaceAddressPolicy {
    private MarketplaceAddressPolicy() {
    }

    public static boolean isBlocked(InetAddress address) {
        if (address == null
                || address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }
        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);
            int third = Byte.toUnsignedInt(bytes[2]);
            return first == 0
                    || first == 127
                    || first >= 224
                    || (first == 100 && second >= 64 && second <= 127)
                    || (first == 192 && second == 0 && (third == 0 || third == 2))
                    || (first == 192 && second == 88 && third == 99)
                    || (first == 198 && (second == 18 || second == 19))
                    || (first == 198 && second == 51 && third == 100)
                    || (first == 203 && second == 0 && third == 113);
        }
        if (bytes.length == 16) {
            if ((bytes[0] & 0xfe) == 0xfc) {
                return true;
            }
            boolean mappedIpv4 = true;
            for (int index = 0; index < 10; index++) {
                mappedIpv4 &= bytes[index] == 0;
            }
            mappedIpv4 &= bytes[10] == (byte) 0xff && bytes[11] == (byte) 0xff;
            if (mappedIpv4) {
                byte[] ipv4 = new byte[]{bytes[12], bytes[13], bytes[14], bytes[15]};
                try {
                    return isBlocked(InetAddress.getByAddress(ipv4));
                } catch (UnknownHostException impossible) {
                    return true;
                }
            }
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);
            int third = Byte.toUnsignedInt(bytes[2]);
            int fourth = Byte.toUnsignedInt(bytes[3]);
            return (first == 0x20 && second == 0x01
                    && (third == 0x0d && fourth == 0xb8
                    || third == 0x00 && (fourth == 0x00 || fourth == 0x02 || fourth == 0x10)))
                    || (first == 0x20 && second == 0x02)
                    || (first == 0x00 && second == 0x64 && third == 0xff && fourth == 0x9b);
        }
        return false;
    }
}
