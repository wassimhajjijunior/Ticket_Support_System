package com.support_tickets.demo.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatsDto {
	private long total;
	private long unassigned;
	private Map<String, Long> byStatus;
	private Map<String, Long> byPriority;
	private long myOpen;
	private List<DailyCountDto> last7Days;
}
