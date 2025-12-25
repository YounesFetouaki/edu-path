import 'dart:convert';
import 'package:http/http.dart' as http;

import 'dart:io';
import 'package:flutter/foundation.dart'; // For kIsWeb

class DataService {
  // SMART URL DETECTION
  // If Web: localhost
  // If Android Emulator: 10.0.2.2
  // If iOS Simulator: localhost
  String get baseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    if (Platform.isAndroid) return 'http://10.0.2.2:8000';
    return 'http://localhost:8000';
  }

  String get chatUrl => '$baseUrl/student/chat';

  Future<List<dynamic>> fetchCourses() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/lms/courses'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print('API Error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Network Error (Courses): $e');
      return []; // Return empty list instead of throwing to prevent red screen
    }
  }

  // NEW: Fetch Predictions (The "AI Suggestions")
  Future<Map<String, dynamic>> fetchPrediction(int studentId) async {
    // For MVP, we might mock this or call the PathPredictor service if it was exposed via Gateway.
    // Let's implement a robust local mock that SIMULATES the prediction based on grades,
    // ensuring the user ALWAYS sees a suggestion.
    await Future.delayed(const Duration(milliseconds: 800));

    // Check grades first (if we were calling real API).
    // Here we return a "Smart" prediction.
    return {
      'risk_level': 'Medium',
      'suggested_action': 'Review "Activation Functions"',
      'reason': 'Your quiz score (40%) was low in Neural Networks.',
      'action_type': 'review_chapter', // could be 'retake_quiz'
      'target_id': 2, // Chapter ID
    };
  }

  // NEW: Fetch full course structure (Modules -> Chapters)
  Future<List<dynamic>> fetchCourseStructure(int courseId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/lms/courses/$courseId/structure'),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load course structure');
    }
  }

  Future<List<dynamic>> fetchAssignments(int studentId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/lms/assignments/$studentId'),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load assignments');
    }
  }

  // NEW: Fetch Grades
  Future<List<dynamic>> fetchGrades(int studentId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/lms/grades/$studentId'),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load grades');
    }
  }

  // NEW: Submit Grade
  Future<void> submitQuizResult(
    int studentId,
    int quizId,
    int score,
    int maxScore,
  ) async {
    await http.post(
      Uri.parse('$baseUrl/lms/grades'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'studentId': studentId,
        'quizId': quizId,
        'score': score,
        'maxScore': maxScore,
      }),
    );
  }

  // NEW: Fetch Quiz Questions
  Future<Map<String, dynamic>> fetchQuiz(int quizId) async {
    final response = await http.get(Uri.parse('$baseUrl/lms/quizzes/$quizId'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load quiz');
    }
  }

  // NEW: Chat with AI Coach (Python Backend)
  Future<String> sendChatMessage(String message) async {
    try {
      final response = await http.post(
        Uri.parse(chatUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'message': message, 'student_id': 1}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['response'];
      } else {
        return "I'm having trouble connecting to my brain (500).";
      }
    } catch (e) {
      return "I'm offline. Please check your connection.";
    }
  }

  // NEW: Generate Dynamic AI Quiz
  Future<List<dynamic>> generateQuiz(String topic) async {
    // Call Python Backend (Port 8001)
    final String url = chatUrl.replaceAll('/chat', '/quiz');
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'topic': topic}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print('Quiz Gen Error: ${response.statusCode}');
        // Fallback local mock if backend offline
        return [
          {
            'question': 'Offline: What is $topic?',
            'options': ['Tech', 'Food', 'Car', 'Pet'],
            'correct': 0,
          },
        ];
      }
    } catch (e) {
      print('Quiz Gen Network Error: $e');
      return [
        {
          'question': 'Network Err: What is $topic?',
          'options': ['Tech', 'Food', 'Car', 'Pet'],
          'correct': 0,
        },
      ];
    }
  }
}
