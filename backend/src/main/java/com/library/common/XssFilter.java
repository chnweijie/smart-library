package com.library.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class XssFilter extends OncePerRequestFilter {

    private static final String APPLICATION_JSON = "application/json";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String contentType = request.getContentType();
        if (contentType != null && contentType.contains(APPLICATION_JSON)) {
            filterChain.doFilter(new XssJsonRequestWrapper(request, objectMapper), response);
        } else {
            filterChain.doFilter(new XssParamRequestWrapper(request), response);
        }
    }

    static String stripXss(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        String cleaned = value;
        cleaned = cleaned.replaceAll("(?i)<script[^>]*>.*?</script>", "");
        cleaned = cleaned.replaceAll("(?i)</script>", "");
        cleaned = cleaned.replaceAll("(?i)<script[^>]*>", "");
        cleaned = cleaned.replaceAll("(?i)javascript:", "");
        cleaned = cleaned.replaceAll("(?i)onerror\\s*=", "");
        cleaned = cleaned.replaceAll("(?i)onload\\s*=", "");
        cleaned = cleaned.replaceAll("(?i)onclick\\s*=", "");
        cleaned = cleaned.replaceAll("(?i)onmouseover\\s*=", "");
        cleaned = cleaned.replaceAll("(?i)onfocus\\s*=", "");
        cleaned = cleaned.replaceAll("(?i)onblur\\s*=", "");
        return cleaned;
    }

    static JsonNode sanitizeJsonNode(JsonNode node) {
        if (node == null) {
            return node;
        }
        if (node.isTextual()) {
            String cleaned = stripXss(node.asText());
            return TextNode.valueOf(cleaned);
        }
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            ObjectNode cleanedNode = objectNode.objectNode();
            var fields = objectNode.fields();
            while (fields.hasNext()) {
                var entry = fields.next();
                cleanedNode.set(entry.getKey(), sanitizeJsonNode(entry.getValue()));
            }
            return cleanedNode;
        }
        if (node.isArray()) {
            ArrayNode arrayNode = (ArrayNode) node;
            ArrayNode cleanedArray = arrayNode.arrayNode();
            for (JsonNode element : arrayNode) {
                cleanedArray.add(sanitizeJsonNode(element));
            }
            return cleanedArray;
        }
        return node;
    }

    static class XssJsonRequestWrapper extends HttpServletRequestWrapper {

        private final byte[] cleanedBody;

        public XssJsonRequestWrapper(HttpServletRequest request, ObjectMapper objectMapper) throws IOException {
            super(request);
            byte[] body = request.getInputStream().readAllBytes();
            byte[] result;
            if (body.length > 0) {
                try {
                    JsonNode rootNode = objectMapper.readTree(body);
                    JsonNode sanitized = sanitizeJsonNode(rootNode);
                    result = objectMapper.writeValueAsBytes(sanitized);
                } catch (Exception e) {
                    result = body;
                }
            } else {
                result = body;
            }
            this.cleanedBody = result;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream bais = new ByteArrayInputStream(cleanedBody);
            return new ServletInputStream() {
                @Override
                public boolean isFinished() {
                    return bais.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener readListener) {
                    throw new UnsupportedOperationException();
                }

                @Override
                public int read() {
                    return bais.read();
                }
            };
        }

        @Override
        public int getContentLength() {
            return cleanedBody.length;
        }

        @Override
        public long getContentLengthLong() {
            return cleanedBody.length;
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return stripXss(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) {
                return null;
            }
            String[] cleanedValues = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                cleanedValues[i] = stripXss(values[i]);
            }
            return cleanedValues;
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            return stripXss(value);
        }
    }

    static class XssParamRequestWrapper extends HttpServletRequestWrapper {

        public XssParamRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return stripXss(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) {
                return null;
            }
            String[] cleanedValues = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                cleanedValues[i] = stripXss(values[i]);
            }
            return cleanedValues;
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> originalMap = super.getParameterMap();
            Map<String, String[]> cleanedMap = new HashMap<>();
            for (Map.Entry<String, String[]> entry : originalMap.entrySet()) {
                String[] values = entry.getValue();
                String[] cleanedValues = new String[values.length];
                for (int i = 0; i < values.length; i++) {
                    cleanedValues[i] = stripXss(values[i]);
                }
                cleanedMap.put(entry.getKey(), cleanedValues);
            }
            return cleanedMap;
        }

        @Override
        public Enumeration<String> getParameterNames() {
            return super.getParameterNames();
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            return stripXss(value);
        }
    }
}
