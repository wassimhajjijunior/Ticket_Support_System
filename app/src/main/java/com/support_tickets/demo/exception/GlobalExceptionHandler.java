package com.support_tickets.demo.exception;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler({ MethodArgumentNotValidException.class, BindException.class })
	public ResponseEntity<ApiErrorResponse> handleBinding(Exception ex, HttpServletRequest request) {
		String message = "Validation failed";
		if (ex instanceof MethodArgumentNotValidException manve) {
			message = firstFieldError(manve.getBindingResult().getFieldErrors());
		} else if (ex instanceof BindException be) {
			message = firstFieldError(be.getBindingResult().getFieldErrors());
		}
		return build(HttpStatus.BAD_REQUEST, message, request);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleConstraint(ConstraintViolationException ex,
			HttpServletRequest request) {
		String message = ex.getConstraintViolations().stream()
				.findFirst()
				.map(v -> v.getMessage())
				.orElse("Validation failed");
		return build(HttpStatus.BAD_REQUEST, message, request);
	}

	@ExceptionHandler({ BadRequestException.class, IllegalArgumentException.class })
	public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception ex, HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex,
			HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, "Malformed or invalid request body", request);
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException ex,
			HttpServletRequest request) {
		return build(HttpStatus.UNAUTHORIZED, "Invalid username or password", request);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex,
			HttpServletRequest request) {
		String message = ex.getMessage() != null ? ex.getMessage() : "Access denied";
		return build(HttpStatus.FORBIDDEN, message, request);
	}

	@ExceptionHandler(EntityNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotFound(EntityNotFoundException ex,
			HttpServletRequest request) {
		return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
	}

	@ExceptionHandler({ NoResourceFoundException.class, NoHandlerFoundException.class })
	public ResponseEntity<ApiErrorResponse> handleNoRoute(Exception ex, HttpServletRequest request) {
		return build(HttpStatus.NOT_FOUND, "Resource not found", request);
	}

	@ExceptionHandler({ DuplicateResourceException.class, DataIntegrityViolationException.class })
	public ResponseEntity<ApiErrorResponse> handleDuplicate(Exception ex, HttpServletRequest request) {
		String message = ex instanceof DuplicateResourceException
				? ex.getMessage()
				: "Resource already exists";
		return build(HttpStatus.CONFLICT, message, request);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex,
			HttpServletRequest request) {
		HttpStatusCode status = ex.getStatusCode();
		String message = ex.getReason() != null ? ex.getReason() : status.toString();
		return build(status, message, request);
	}

	@ExceptionHandler(ErrorResponseException.class)
	public ResponseEntity<ApiErrorResponse> handleErrorResponse(ErrorResponseException ex,
			HttpServletRequest request) {
		return build(ex.getStatusCode(), ex.getBody().getDetail(), request);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
		log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
		return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request);
	}

	private String firstFieldError(java.util.List<FieldError> errors) {
		return errors.stream()
				.findFirst()
				.map(FieldError::getDefaultMessage)
				.orElse("Validation failed");
	}

	private ResponseEntity<ApiErrorResponse> build(HttpStatusCode status, String message,
			HttpServletRequest request) {
		String error = HttpStatus.resolve(status.value()) != null
				? HttpStatus.valueOf(status.value()).getReasonPhrase()
				: "Error";
		ApiErrorResponse body = new ApiErrorResponse(
				Instant.now(),
				status.value(),
				error,
				message,
				request.getRequestURI());
		return ResponseEntity.status(status).body(body);
	}
}
