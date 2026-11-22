// Data Models with Firestore serialization & deserialization

class UserModel {
  final String id;
  final String fullName;
  final String role;
  final String? phone;
  final String? department;
  final bool isActive;

  UserModel({
    required this.id,
    required this.fullName,
    required this.role,
    this.phone,
    this.department,
    this.isActive = true,
  });

  factory UserModel.fromMap(Map<String, dynamic> map, String id) {
    return UserModel(
      id: id,
      fullName: map['fullName'] ?? '',
      role: map['role'] ?? '',
      phone: map['phone'],
      department: map['department'],
      isActive: map['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fullName': fullName,
      'role': role,
      'phone': phone,
      'department': department,
      'isActive': isActive,
    };
  }
}

class PersonalNoteModel {
  final String id;
  final String userId;
  final String authorName;
  final String title;
  final String content;
  final String category;
  final String color;
  final bool isPinned;
  final String createdAt;
  final String? updatedAt;

  PersonalNoteModel({
    required this.id,
    required this.userId,
    required this.authorName,
    required this.title,
    required this.content,
    this.category = 'eslatma',
    this.color = 'yellow',
    this.isPinned = false,
    required this.createdAt,
    this.updatedAt,
  });

  factory PersonalNoteModel.fromMap(Map<String, dynamic> map, String id) {
    return PersonalNoteModel(
      id: id,
      userId: map['userId'] ?? '',
      authorName: map['authorName'] ?? '',
      title: map['title'] ?? '',
      content: map['content'] ?? '',
      category: map['category'] ?? 'eslatma',
      color: map['color'] ?? 'yellow',
      isPinned: map['isPinned'] ?? false,
      createdAt: map['createdAt'] ?? '',
      updatedAt: map['updatedAt'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'authorName': authorName,
      'title': title,
      'content': content,
      'category': category,
      'color': color,
      'isPinned': isPinned,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

class AttendanceModel {
  final String id;
  final String userId;
  final String userName;
  final String role;
  final String date;
  final String checkInTime;
  final bool isSubstitution;
  final String? originalWorkerName;
  final String? substituteWorkerName;
  final String status;
  final String? notes;

  AttendanceModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.role,
    required this.date,
    required this.checkInTime,
    this.isSubstitution = false,
    this.originalWorkerName,
    this.substituteWorkerName,
    required this.status,
    this.notes,
  });

  factory AttendanceModel.fromMap(Map<String, dynamic> map, String id) {
    return AttendanceModel(
      id: id,
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? '',
      role: map['role'] ?? '',
      date: map['date'] ?? '',
      checkInTime: map['checkInTime'] ?? '',
      isSubstitution: map['isSubstitution'] ?? false,
      originalWorkerName: map['originalWorkerName'],
      substituteWorkerName: map['substituteWorkerName'],
      status: map['status'] ?? 'keldi',
      notes: map['notes'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'role': role,
      'date': date,
      'checkInTime': checkInTime,
      'isSubstitution': isSubstitution,
      'originalWorkerName': originalWorkerName,
      'substituteWorkerName': substituteWorkerName,
      'status': status,
      'notes': notes,
    };
  }
}

class FarmTaskModel {
  final String id;
  final String title;
  final String description;
  final String assignedByName;
  final String assignedToRole;
  final String assignedToName;
  final String priority;
  final String status;
  final String createdAt;
  final String? completedAt;
  final int? evaluationScore;

  FarmTaskModel({
    required this.id,
    required this.title,
    required this.description,
    required this.assignedByName,
    required this.assignedToRole,
    required this.assignedToName,
    this.priority = 'orta',
    this.status = 'yangi',
    required this.createdAt,
    this.completedAt,
    this.evaluationScore,
  });

  factory FarmTaskModel.fromMap(Map<String, dynamic> map, String id) {
    return FarmTaskModel(
      id: id,
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      assignedByName: map['assignedByName'] ?? '',
      assignedToRole: map['assignedToRole'] ?? '',
      assignedToName: map['assignedToName'] ?? '',
      priority: map['priority'] ?? 'orta',
      status: map['status'] ?? 'yangi',
      createdAt: map['createdAt'] ?? '',
      completedAt: map['completedAt'],
      evaluationScore: map['evaluationScore'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'assignedByName': assignedByName,
      'assignedToRole': assignedToRole,
      'assignedToName': assignedToName,
      'priority': priority,
      'status': status,
      'createdAt': createdAt,
      'completedAt': completedAt,
      'evaluationScore': evaluationScore,
    };
  }
}
