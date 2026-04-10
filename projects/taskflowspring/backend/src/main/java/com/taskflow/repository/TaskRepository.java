package com.taskflow.repository;

import com.taskflow.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStatusOrderByPositionAsc(String status);
    List<Task> findByAssigneeIdOrderByPositionAsc(Long assigneeId);
    List<Task> findByDueDateBetweenAndStatusNot(LocalDate start, LocalDate end, String excludeStatus);
    long countByStatus(String status);
    long countByAssigneeId(Long assigneeId);
}
