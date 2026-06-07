package com.library.common.converter;

import com.library.entity.SystemAnnouncement;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AnnouncementPriorityConverter implements AttributeConverter<SystemAnnouncement.AnnouncementPriority, Integer> {

    @Override
    public Integer convertToDatabaseColumn(SystemAnnouncement.AnnouncementPriority attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public SystemAnnouncement.AnnouncementPriority convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        // 兼容旧数据：0(原NORMAL)映射为LOW(3)，1(原IMPORTANT)映射为HIGH(1)
        if (dbData == 0) {
            return SystemAnnouncement.AnnouncementPriority.LOW;
        }
        return SystemAnnouncement.AnnouncementPriority.fromValue(dbData);
    }
}
