package com.library.repository;

import com.library.entity.SystemAnnouncement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemAnnouncementRepository extends JpaRepository<SystemAnnouncement, Long> {

    List<SystemAnnouncement> findByPriority(SystemAnnouncement.AnnouncementPriority priority);

    Page<SystemAnnouncement> findByPriority(SystemAnnouncement.AnnouncementPriority priority, Pageable pageable);

    List<SystemAnnouncement> findByCreatedBy(Long createdBy);

    Page<SystemAnnouncement> findAllByOrderByIdAsc(Pageable pageable);

    List<SystemAnnouncement> findTop5ByOrderByIdAsc();
}
