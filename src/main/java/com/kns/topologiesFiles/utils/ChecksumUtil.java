package com.kns.topologiesFiles.utils;

import java.security.MessageDigest;

public class ChecksumUtil {

    private ChecksumUtil() {
    }

    public static String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);

            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }

            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar checksum SHA-256", e);
        }
    }
}