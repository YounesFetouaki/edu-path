import 'package:flutter/material.dart';

class LessonScreen extends StatelessWidget {
  final String title;
  final String content;
  final String type;

  const LessonScreen({super.key, required this.title, required this.content, required this.type});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
             if (type == 'video') ...[
               Container(
                 height: 200,
                 width: double.infinity,
                 color: Colors.black,
                 alignment: Alignment.center,
                 child: const Icon(Icons.play_circle_filled, color: Colors.white, size: 64),
               ),
               const SizedBox(height: 16),
               Text('Video URL: $content', style: const TextStyle(color: Colors.blue)),
             ] else ...[
               Text(content, style: const TextStyle(fontSize: 16, height: 1.5)),
             ],
             const Spacer(),
             SizedBox(
               width: double.infinity,
               child: ElevatedButton(
                 onPressed: () {
                   Navigator.pop(context);
                 }, 
                 child: const Text('Mark as Complete')
               ),
             )
           ],
        ),
      ),
    );
  }
}
