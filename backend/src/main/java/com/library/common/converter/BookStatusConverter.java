package com.library.common.converter;

import com.library.entity.Book;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BookStatusConverter implements AttributeConverter<Book.BookStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Book.BookStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public Book.BookStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (Book.BookStatus status : Book.BookStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown BookStatus value: " + dbData);
    }
}
