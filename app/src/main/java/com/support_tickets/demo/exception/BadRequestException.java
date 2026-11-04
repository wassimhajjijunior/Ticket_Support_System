package com.support_tickets.demo.exception;

public class BadRequestException extends RuntimeException {

	public BadRequestException(String message) {
		super(message);
	}
}
