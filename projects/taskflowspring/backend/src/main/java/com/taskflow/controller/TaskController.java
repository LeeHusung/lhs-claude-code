package com.taskflow.controller;

import com.taskflow.dto.TaskMoveRequest;
import com.taskflow.dto.TaskRequest;
import com.taskflow.entity.Task;
import com.taskflow.repository.MemberRepository;
import com.taskflow.repository.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final MemberRepository memberRepository;

    public TaskController(TaskRepository taskRepository, MemberRepository memberRepository) {
        this.taskRepository = taskRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public List<Task> getAll() {
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getById(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-status")
    public Map<String, List<Task>> getByStatus() {
        Map<String, List<Task>> result = new LinkedHashMap<>();
        result.put("TODO", taskRepository.findByStatusOrderByPositionAsc("TODO"));
        result.put("IN_PROGRESS", taskRepository.findByStatusOrderByPositionAsc("IN_PROGRESS"));
        result.put("REVIEW", taskRepository.findByStatusOrderByPositionAsc("REVIEW"));
        result.put("DONE", taskRepository.findByStatusOrderByPositionAsc("DONE"));
        return result;
    }

    @PostMapping
    public ResponseEntity<Task> create(@RequestBody TaskRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Task t = new Task();
        t.setTitle(req.getTitle());
        t.setDescription(req.getDescription());
        t.setStatus(req.getStatus() != null ? req.getStatus() : "TODO");
        t.setPriority(req.getPriority() != null ? req.getPriority() : "MEDIUM");
        t.setDueDate(req.getDueDate());
        t.setPosition(req.getPosition() != null ? req.getPosition() : 0);
        if (req.getAssigneeId() != null) {
            memberRepository.findById(req.getAssigneeId()).ifPresent(t::setAssignee);
        }
        return ResponseEntity.ok(taskRepository.save(t));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> update(@PathVariable Long id, @RequestBody TaskRequest req) {
        return taskRepository.findById(id).map(t -> {
            if (req.getTitle() != null) t.setTitle(req.getTitle());
            if (req.getDescription() != null) t.setDescription(req.getDescription());
            if (req.getStatus() != null) t.setStatus(req.getStatus());
            if (req.getPriority() != null) t.setPriority(req.getPriority());
            if (req.getDueDate() != null) t.setDueDate(req.getDueDate());
            if (req.getPosition() != null) t.setPosition(req.getPosition());
            if (req.getAssigneeId() != null) {
                memberRepository.findById(req.getAssigneeId()).ifPresent(t::setAssignee);
            }
            return ResponseEntity.ok(taskRepository.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<Task> move(@PathVariable Long id, @RequestBody TaskMoveRequest req) {
        return taskRepository.findById(id).map(t -> {
            if (req.getStatus() != null) t.setStatus(req.getStatus());
            if (req.getPosition() != null) t.setPosition(req.getPosition());
            return ResponseEntity.ok(taskRepository.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        byStatus.put("TODO", taskRepository.countByStatus("TODO"));
        byStatus.put("IN_PROGRESS", taskRepository.countByStatus("IN_PROGRESS"));
        byStatus.put("REVIEW", taskRepository.countByStatus("REVIEW"));
        byStatus.put("DONE", taskRepository.countByStatus("DONE"));
        stats.put("byStatus", byStatus);

        List<Map<String, Object>> byAssignee = memberRepository.findAll().stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", m.getName());
            map.put("count", taskRepository.countByAssigneeId(m.getId()));
            return map;
        }).toList();
        stats.put("byAssignee", byAssignee);

        stats.put("total", taskRepository.count());

        LocalDate today = LocalDate.now();
        List<Task> upcoming = taskRepository.findByDueDateBetweenAndStatusNot(today, today.plusDays(3), "DONE");
        stats.put("upcoming", upcoming);

        return stats;
    }
}
