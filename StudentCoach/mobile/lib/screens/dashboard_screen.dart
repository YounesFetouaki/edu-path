import 'package:flutter/material.dart';
import '../services/data_service.dart';
import 'course_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final DataService _dataService = DataService();
  
  // Data State
  List<dynamic> _courses = [];
  List<dynamic> _assignments = [];
  Map<String, dynamic>? _prediction;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    try {
      // Parallel Fetching
      final courses = await _dataService.fetchCourses();
      final assignments = await _dataService.fetchAssignments(1); // Student ID 1
      final prediction = await _dataService.fetchPrediction(1);

      if (mounted) {
        setState(() {
          _courses = courses;
          _assignments = assignments;
          _prediction = prediction;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Dashboard Error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildWelcomeSection(),
          const SizedBox(height: 24),
          if (_prediction != null) _buildPredictionCard(),
          const SizedBox(height: 24),
          _buildSectionHeader('Your Courses'),
          const SizedBox(height: 8),
          _buildCoursesList(),
          const SizedBox(height: 24),
          _buildSectionHeader('Assignments'),
          const SizedBox(height: 8),
          _buildAssignmentsList(),
        ],
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Hello, Alex! 👋',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        Text(
          'Ready to learn today?',
          style: TextStyle(fontSize: 16, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildPredictionCard() {
    final p = _prediction!;
    Color cardColor = Colors.blue.shade50;
    IconData icon = Icons.lightbulb;
    
    if (p['risk_level'] == 'High') {
        cardColor = Colors.red.shade50;
        icon = Icons.warning;
    } else if (p['risk_level'] == 'Medium') {
        cardColor = Colors.orange.shade50;
        icon = Icons.trending_up;
    }

    return Card(
      color: cardColor,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.orange[800], size: 30),
                const SizedBox(width: 12),
                const Text('AI Suggestion', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
             Text(p['reason'] ?? '', style: const TextStyle(fontSize: 14, color: Colors.black87)),
             const SizedBox(height: 8),
             Container(
                 width: double.infinity,
                 padding: const EdgeInsets.all(12),
                 decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                 child: Row(
                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
                     children: [
                         Text(p['suggested_action'] ?? 'Review Course', style: const TextStyle(fontWeight: FontWeight.bold)),
                         const Icon(Icons.arrow_forward_ios, size: 16)
                     ],
                 ),
             )
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildCoursesList() {
    if (_courses.isEmpty) {
        return const Card(child: Padding(padding: EdgeInsets.all(16), child: Text("No courses found. Check API connection.")));
    }
    
    return Column(
      children: _courses.map((course) => Card(
        margin: const EdgeInsets.only(bottom: 12),
        elevation: 2,
        child: ListTile(
          leading: Container(
             width: 50, height: 50, color: Colors.blue.shade100, 
             child: const Icon(Icons.school, color: Colors.blue),
          ),
          title: Text(course['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text(course['category'] ?? 'General'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(
              builder: (context) => CourseDetailScreen(
                courseId: course['id'],
                title: course['title'],
              ),
            ));
          },
        ),
      )).toList(),
    );
  }

  Widget _buildAssignmentsList() {
     if (_assignments.isEmpty) {
        return const Text("No pending assignments.", style: TextStyle(color: Colors.grey));
    }
    
    return Column(
      children: _assignments.map((a) => Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: ListTile(
          leading: const Icon(Icons.assignment, color: Colors.orange),
          title: Text(a['title']),
          subtitle: Text('Due: ${a['due_date']?.substring(0, 10) ?? 'Soon'}'),
          trailing: const Chip(label: Text('Pending'), backgroundColor: Colors.orangeAccent),
        ),
      )).toList(),
    );
  }
}
