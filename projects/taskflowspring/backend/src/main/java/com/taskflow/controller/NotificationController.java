package com.taskflow.controller;

import com.taskflow.entity.Notification;
import com.taskflow.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/member/{memberId}")
    public List<Notification> getByMember(@PathVariable Long memberId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(memberId);
    }

    @GetMapping("/member/{memberId}/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable Long memberId) {
        Map<String, Long> result = new HashMap<>();
        result.put("count", notificationRepository.countByRecipientIdAndIsReadFalse(memberId));
        return result;
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(n -> {
            n.setIsRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/member/{memberId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long memberId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(memberId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }
}
