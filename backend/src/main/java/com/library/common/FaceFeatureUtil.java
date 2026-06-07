package com.library.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collection;
import java.util.List;

/**
 * 人脸特征向量序列化/反序列化（统一为 JSON 数组格式，与前端 face-api 一致）
 */
public final class FaceFeatureUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private FaceFeatureUtil() {
    }

    /**
     * 将存储字符串解析为 double 数组，兼容历史逗号分隔格式
     */
    public static double[] parse(String featureStr) {
        if (featureStr == null || featureStr.isBlank()) {
            throw BusinessException.badRequest("人脸特征数据为空");
        }
        String trimmed = featureStr.trim();
        if (trimmed.startsWith("[")) {
            try {
                List<Double> list = MAPPER.readValue(trimmed, new TypeReference<>() {});
                double[] arr = new double[list.size()];
                for (int i = 0; i < list.size(); i++) {
                    arr[i] = list.get(i);
                }
                return arr;
            } catch (Exception e) {
                throw BusinessException.badRequest("人脸特征 JSON 格式错误");
            }
        }
        try {
            String[] parts = trimmed.split(",");
            double[] feature = new double[parts.length];
            for (int i = 0; i < parts.length; i++) {
                feature[i] = Double.parseDouble(parts[i].trim());
            }
            return feature;
        } catch (NumberFormatException e) {
            throw BusinessException.badRequest("人脸特征数据格式错误");
        }
    }

    /**
     * 序列化为 JSON 数组字符串存入数据库
     */
    public static String serialize(double[] feature) {
        try {
            return MAPPER.writeValueAsString(feature);
        } catch (Exception e) {
            throw BusinessException.badRequest("人脸特征序列化失败");
        }
    }

    /**
     * 规范化客户端传入的 faceFeature（数组 JSON 字符串或已存储格式）
     */
    public static String normalizeForStorage(String faceFeature) {
        return serialize(parse(faceFeature));
    }

    /**
     * 解析请求体中的 faceFeature（支持字符串或 JSON 数组）
     */
    public static String fromRequestValue(Object value) {
        if (value == null) {
            throw BusinessException.badRequest("人脸特征数据为空");
        }
        if (value instanceof String s) {
            return normalizeForStorage(s);
        }
        if (value instanceof Collection<?> collection) {
            double[] arr = new double[collection.size()];
            int i = 0;
            for (Object item : collection) {
                arr[i++] = ((Number) item).doubleValue();
            }
            return serialize(arr);
        }
        if (value instanceof Number[] numbers) {
            double[] arr = new double[numbers.length];
            for (int i = 0; i < numbers.length; i++) {
                arr[i] = numbers[i].doubleValue();
            }
            return serialize(arr);
        }
        try {
            return normalizeForStorage(MAPPER.writeValueAsString(value));
        } catch (Exception e) {
            throw BusinessException.badRequest("人脸特征数据格式错误");
        }
    }

    public static double euclideanDistance(double[] a, double[] b) {
        if (a.length != b.length) {
            throw BusinessException.badRequest("人脸特征维度不匹配");
        }
        double sum = 0.0;
        for (int i = 0; i < a.length; i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
}
