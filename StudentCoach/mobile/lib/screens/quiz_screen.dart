import 'package:flutter/material.dart';
import '../services/data_service.dart';

class QuizScreen extends StatefulWidget {
  final String quizTitle;
  final int? quizId; // Optional for AI Quizzes
  final List<dynamic>? aiQuestions; // For AI Quizzes

  const QuizScreen({
    super.key, 
    required this.quizTitle, 
    this.quizId,
    this.aiQuestions
  });

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final DataService _dataService = DataService();
  bool _isLoading = true;
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
    // Mode 1: AI Quiz (Questions passed directly)
    if (widget.aiQuestions != null && widget.aiQuestions!.isNotEmpty) {
      setState(() {
        _questions = widget.aiQuestions!;
        _isLoading = false;
      });
      return;
    }

    // Mode 2: LMS Quiz (Fetch from Backend)
    if (widget.quizId != null) {
      try {
        final quiz = await _dataService.fetchQuiz(widget.quizId!);
        setState(() {
          _questions = quiz['questions'] ?? [];
          _isLoading = false;
        });
      } catch (e) {
        setState(() => _isLoading = false);
        print('Error loading quiz: $e');
      }
    }
  }

  Future<void> _submitQuiz() async {
    // Calculate score
    int correctCount = 0;
    for (int i = 0; i < _questions.length; i++) {
        final q = _questions[i];
        final correctIndex = q['correct'] ?? q['correct_option']; // Handle both formats
        if (_answers[i] == correctIndex) {
            correctCount++;
        }
    }
    
    _score = ((correctCount / _questions.length) * 100).toInt();

    // Save to backend IF it's an LMS quiz
    if (widget.quizId != null) {
        try {
            await _dataService.submitQuizResult(1, widget.quizId!, _score, 100);
        } catch (e) {
            print('Failed to save result: $e');
        }
    }
    
    setState(() {
        _completed = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_completed) return _buildResultScreen();

    if (_questions.isEmpty) return const Scaffold(body: Center(child: Text("No questions found.")));

    final question = _questions[_currentIndex];
    final options = (question['options'] as List).cast<String>();
    final progress = (_currentIndex + 1) / _questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.quizTitle),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
      body: Column(
        children: [
           LinearProgressIndicator(value: progress, minHeight: 6, backgroundColor: Colors.grey.shade200, color: Colors.blueAccent),
           Expanded(
             child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Question ${_currentIndex + 1}/${_questions.length}', 
                       style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 16),
                  Text(question['question'] ?? question['question_text'], 
                       style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.3)),
                  const SizedBox(height: 32),
                  ...List.generate(options.length, (index) {
                      final isSelected = _answers[_currentIndex] == index;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: InkWell(
                          onTap: () {
                              setState(() {
                                  _answers[_currentIndex] = index;
                              });
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                  color: isSelected ? Colors.blue.shade50 : Colors.white,
                                  border: Border.all(color: isSelected ? Colors.blue : Colors.grey.shade300, width: 2),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                     if (!isSelected) BoxShadow(color: Colors.grey.shade100, blurRadius: 4, offset: const Offset(0, 2))
                                  ]
                              ),
                              child: Row(
                                  children: [
                                      Container(
                                          width: 24, height: 24,
                                          decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              border: Border.all(color: isSelected ? Colors.blue : Colors.grey.shade400),
                                              color: isSelected ? Colors.blue : Colors.transparent
                                          ),
                                          child: isSelected ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(child: Text(options[index], style: TextStyle(fontSize: 16, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)))
                                  ],
                              ),
                          ),
                        ),
                      );
                  }),
                ],
              ),
             ),
           ),
           Padding(
             padding: const EdgeInsets.all(20),
             child: Row(
               mainAxisAlignment: MainAxisAlignment.spaceBetween,
               children: [
                  if (_currentIndex > 0)
                      TextButton.icon(
                        onPressed: () => setState(() => _currentIndex--), 
                        icon: const Icon(Icons.arrow_back), label: const Text('Previous')
                      )
                  else const SizedBox(width: 10), // Spacer
                  
                  ElevatedButton(
                         onPressed: _answers.containsKey(_currentIndex) ? () {
                             if (_currentIndex < _questions.length - 1) {
                                  setState(() => _currentIndex++);
                             } else {
                                  _submitQuiz();
                             }
                         } : null, 
                         style: ElevatedButton.styleFrom(
                             backgroundColor: Colors.blueAccent,
                             foregroundColor: Colors.white,
                             padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                             shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                             elevation: 4
                         ),
                         child: Text(_currentIndex == _questions.length - 1 ? 'Finish Quiz' : 'Next Question', style: const TextStyle(fontWeight: FontWeight.bold))
                   )
               ],
             ),
           )
        ],
      ),
    );
  }

  Widget _buildResultScreen() {
    return Scaffold(
        body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                      Container(
                          padding: const EdgeInsets.all(30),
                          decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _score >= 70 ? Colors.green.shade50 : Colors.orange.shade50,
                          ),
                          child: Icon(
                             _score >= 70 ? Icons.emoji_events : Icons.school, 
                             color: _score >= 70 ? Colors.green : Colors.orange, 
                             size: 80
                          ),
                      ),
                      const SizedBox(height: 32),
                      Text('Quiz Completed!', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Text('Your Score', style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
                      Text('$_score%', style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.blue.shade900)),
                      const SizedBox(height: 16),
                      Text(_score >= 70 ? 'Excellent work! You\'ve mastered this topic.' : 'Good effort! Review the material and try again.', 
                           textAlign: TextAlign.center,
                           style: const TextStyle(fontSize: 16, color: Colors.grey)),
                      const SizedBox(height: 48),
                      SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context), 
                            style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blueAccent,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                            ),
                            child: const Text('Back to Learning', style: TextStyle(fontSize: 18))
                          )
                      )
                  ],
              ),
            ),
        ),
    );
  }
}
