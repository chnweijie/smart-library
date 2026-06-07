package com.library.common.converter;

import com.library.entity.BookReservation;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReservationStatusConverter implements AttributeConverter<BookReservation.ReservationStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BookReservation.ReservationStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public BookReservation.ReservationStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (BookReservation.ReservationStatus status : BookReservation.ReservationStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown ReservationStatus value: " + dbData);
    }
}
