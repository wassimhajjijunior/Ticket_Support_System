package com.support_tickets.demo.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DailyCountDto {
	private LocalDate date;
	private long created;
	private long closed;
}
