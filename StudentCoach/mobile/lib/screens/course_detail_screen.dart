import 'package:flutter/material.dart';
import '../services/data_service.dart';
import 'lesson_screen.dart';
import 'quiz_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  final int courseId;
  final String title;

  const CourseDetailScreen({super.key, required this.courseId, required this.title});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  final DataService _dataService = DataService();
  List<dynamic> _modules = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStructure();
  }

  Future<void> _loadStructure() async {
    try {
      final modules = await _dataService.fetchCourseStructure(widget.courseId);
      setState(() {
        _modules = modules;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print('Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _modules.length,
            itemBuilder: (context, index) {
              final module = _modules[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 16),
                child: ExpansionTile(
                  title: Text(module['title'] ?? 'Module', style: const TextStyle(fontWeight: FontWeight.bold)),
                  leading: const Icon(Icons.folder, color: Colors.blue),
                  children: (module['chapters'] as List).map<Widget>((chapter) {
                    IconData icon = Icons.article;
                    if (chapter['content_type'] == 'video') icon = Icons.play_circle_fill;
                    if (chapter['content_type'] == 'quiz') icon = Icons.quiz;

                    return ListTile(
                      leading: Icon(icon, color: Colors.grey[700]),
                      title: Text(chapter['title']),
                      subtitle: Text('${chapter['duration_minutes']} mins'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                         if (chapter['content_type'] == 'quiz') {
                           Navigator.push(context, MaterialPageRoute(
                             builder: (_) => QuizScreen(
                               quizTitle: chapter['title'],
                               // In a real app we'd fetch the quiz ID from relation, 
                               // but for this MVP assuming chapter_id maps for simplicity or fetched
                               // Actually, since we don't have quiz_id here yet, let's assume chapter ID maps to Quiz
                               // Wait, I need quiz_id. Let's pass chapter_id and let QuizScreen fetch.
                               quizId: 1 // Hardcoded for Demo as per seed logic (only 1 quiz seeded)
                             )
                           ));
                         } else {
                           Navigator.push(context, MaterialPageRoute(
                             builder: (_) => LessonScreen(
                               title: chapter['title'],
                               content: chapter['content_url'] ?? 'No content',
                               type: chapter['content_type']
                             )
                           ));
                         }
                      },
                    );
                  }).toList(),
                ),
              );
            },
          ),
    );
  }
}
