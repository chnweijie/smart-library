package com.library.common.converter;

import com.library.entity.User;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class UserRoleConverter implements AttributeConverter<User.UserRole, Integer> {

    @Override
    public Integer convertToDatabaseColumn(User.UserRole attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public User.UserRole convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (User.UserRole role : User.UserRole.values()) {
            if (role.getValue() == dbData) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown UserRole value: " + dbData);
    }
}
