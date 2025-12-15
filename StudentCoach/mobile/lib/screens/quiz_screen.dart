import 'package:flutter/material.dart';
import '../services/data_service.dart';

class QuizScreen extends StatefulWidget {
  final String quizTitle;
  final int quizId;

  const QuizScreen({super.key, required this.quizTitle, required this.quizId});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final DataService _dataService = DataService();
  bool _isLoading = true;
  Map<String, dynamic> _quizData = {};
  List<dynamic> _questions = [];
  
  int _currentIndex = 0;
  int _score = 0;
  bool _completed = false;
  Map<int, int> _answers = {}; // questionIndex -> selectedOptionIndex

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    try {
      final quiz = await _dataService.fetchQuiz(widget.quizId);
      setState(() {
        _quizData = quiz;
        _questions = quiz['questions'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print('Error loading quiz: $e');
    }
  }

  Future<void> _submitQuiz() async {
    // Calculate score
    int correctCount = 0;
    for (int i = 0; i < _questions.length; i++) {
        final q = _questions[i];
        if (_answers[i] == q['correct_option']) {
            correctCount++;
        }
    }
    
    // Save to backend
    // Hardcoded Student ID 1 (Alex Risk)
    _score = (correctCount / _questions.length * 100).toInt();
    
    try {
        await _dataService.submitQuizResult(1, widget.quizId, _score, 100);
        setState(() {
            _completed = true;
        });
    } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save result')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_completed) return _buildResultScreen();

    final question = _questions[_currentIndex];
    final options = (question['options'] as List).cast<String>();

    return Scaffold(
      appBar: AppBar(title: Text(widget.quizTitle)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Question ${_currentIndex + 1}/${_questions.length}', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            Text(question['question_text'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ...List.generate(options.length, (index) {
                final isSelected = _answers[_currentIndex] == index;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        backgroundColor: isSelected ? Colors.blue.withOpacity(0.1) : null,
                        side: BorderSide(color: isSelected ? Colors.blue : Colors.grey)
                    ),
                    onPressed: () {
                        setState(() {
                            _answers[_currentIndex] = index;
                        });
                    },
                    child: Container(
                        width: double.infinity,
                        child: Text(options[index], style: const TextStyle(color: Colors.black87))
                    ),
                  ),
                );
            }),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentIndex > 0)
                    TextButton(onPressed: () => setState(() => _currentIndex--), child: const Text('Previous')),
                
                if (_currentIndex < _questions.length - 1)
                     ElevatedButton(
                         onPressed: _answers.containsKey(_currentIndex) ? () => setState(() => _currentIndex++) : null, 
                         child: const Text('Next')
                     )
                else
                     ElevatedButton(
                         onPressed: _answers.containsKey(_currentIndex) ? _submitQuiz : null, 
                         style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                         child: const Text('Submit Quiz')
                     )
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildResultScreen() {
    return Scaffold(
        appBar: AppBar(title: const Text('Quiz Results')),
        body: Center(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    const Icon(Icons.check_circle_outline, color: Colors.green, size: 80),
                    const SizedBox(height: 24),
                    Text('You Scored $_score%', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Text(_score >= 70 ? 'Great Job! You passed.' : 'Keep studying. You can do better!', style: const TextStyle(fontSize: 18, color: Colors.grey)),
                    const SizedBox(height: 48),
                    ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Back to Course'))
                ],
            ),
        ),
    );
  }
}
