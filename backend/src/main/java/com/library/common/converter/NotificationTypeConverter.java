package com.library.common.converter;

import com.library.entity.Notification;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<Notification.NotificationType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Notification.NotificationType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public Notification.NotificationType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (Notification.NotificationType type : Notification.NotificationType.values()) {
            if (type.getValue() == dbData) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown NotificationType value: " + dbData);
    }
}
