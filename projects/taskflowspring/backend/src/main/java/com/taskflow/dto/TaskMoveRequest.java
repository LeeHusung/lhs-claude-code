package com.taskflow.dto;

public class TaskMoveRequest {
    private String status;
    private Integer position;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
