import 'package:flutter/material.dart';
import '../services/data_service.dart';
import 'course_detail_screen.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  final DataService _dataService = DataService();
  List<dynamic> _courses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  Future<void> _fetchCourses() async {
    try {
      final courses = await _dataService.fetchCourses();
      if (mounted) {
        setState(() {
          _courses = courses;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _courses.isEmpty 
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                       const Icon(Icons.signal_wifi_off, size: 64, color: Colors.grey),
                       const SizedBox(height: 16),
                       const Text("No courses found.", style: TextStyle(fontSize: 18, color: Colors.grey)),
                       TextButton(onPressed: _fetchCourses, child: const Text("Retry"))
                    ],
                  )
                )
              : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _courses.length,
              itemBuilder: (context, index) {
                final course = _courses[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: InkWell(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(
                        builder: (_) => CourseDetailScreen(courseId: course['id'], title: course['title'])
                      ));
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 120,
                          decoration: BoxDecoration(
                            color: Colors.blue.shade200,
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                            image: course['thumbnail_url'] != null ? DecorationImage(
                                image: NetworkImage(course['thumbnail_url']),
                                fit: BoxFit.cover
                            ) : null
                          ),
                          alignment: Alignment.center,
                          child: course['thumbnail_url'] == null 
                             ? const Icon(Icons.image, size: 50, color: Colors.white) 
                             : null,
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(course['title'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text(course['description'] ?? 'No description', maxLines: 2, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Chip(label: Text(course['category'] ?? 'General'), backgroundColor: Colors.blue.shade50),
                                  const Spacer(),
                                  const Text("Start Learning", style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                                  const Icon(Icons.arrow_forward, color: Colors.blue, size: 16)
                                ],
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
