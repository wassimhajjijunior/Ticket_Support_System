package com.support_tickets.demo.entity;

import java.util.Locale;

public enum Priority {
	LOW,
	MEDIUM,
	HIGH,
	URGENT;

	public static Priority from(String raw) {
		if (raw == null || raw.isBlank()) {
			throw new IllegalArgumentException("Priority is required");
		}
		try {
			return valueOf(raw.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException ex) {
			throw new IllegalArgumentException(
					"Invalid priority '" + raw + "'. Allowed: LOW, MEDIUM, HIGH, URGENT");
		}
	}
}
