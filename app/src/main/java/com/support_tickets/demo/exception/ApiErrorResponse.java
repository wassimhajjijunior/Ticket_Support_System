package com.support_tickets.demo.exception;

import java.time.Instant;

public record ApiErrorResponse(
		Instant timestamp,
		int status,
		String error,
		String message,
		String path) {
}
