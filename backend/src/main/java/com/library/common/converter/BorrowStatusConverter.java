package com.library.common.converter;

import com.library.entity.BorrowRecord;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BorrowStatusConverter implements AttributeConverter<BorrowRecord.BorrowStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BorrowRecord.BorrowStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public BorrowRecord.BorrowStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (BorrowRecord.BorrowStatus status : BorrowRecord.BorrowStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown BorrowStatus value: " + dbData);
    }
}
