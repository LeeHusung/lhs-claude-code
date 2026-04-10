package com.taskflow.dto;

import java.time.LocalDate;

public class TaskRequest {
    private String title;
    private String description;
    private String status;
    private String priority;
    private Long assigneeId;
    private LocalDate dueDate;
    private Integer position;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
