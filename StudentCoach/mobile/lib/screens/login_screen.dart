import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import 'main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  String? _errorMessage;

  void _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final username = _usernameController.text;
      final password = _passwordController.text;

      if (username.isEmpty || password.isEmpty) {
        throw Exception('Please fill in all fields');
      }

      // Call API
      final response = await _apiService.login(username, password);
      final user = response['user']; // Can be used later

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MainScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Background Gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0F172A),
                  Color(0xFF1E293B),
                  Color(0xFF334155),
                ], // Slate 900 -> 700
              ),
            ),
          ),

          // 2. Abstract Shapes
          Positioned(
            top: -100,
            right: -100,
            child:
                Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.blueAccent.withOpacity(0.1),
                      ),
                    )
                    .animate()
                    .scale(duration: 2000.ms, curve: Curves.easeInOut)
                    .fadeIn(),
          ),

          // 3. Content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo / Icon
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      size: 60,
                      color: Colors.blueAccent,
                    ),
                  ).animate().slideY(
                    begin: -0.5,
                    end: 0,
                    duration: 600.ms,
                    curve: Curves.easeOutBack,
                  ),

                  const SizedBox(height: 30),

                  // Title
                  Text(
                    'Welcome Back',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ).animate().fadeIn(delay: 200.ms),

                  Text(
                    'Sign in to continue your learning journey',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey.shade400,
                    ),
                  ).animate().fadeIn(delay: 400.ms),

                  const SizedBox(height: 48),

                  // Error Message
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.red.shade900.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade400),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.error_outline,
                            color: Colors.redAccent,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(),

                  // Username Field
                  _buildTextField(
                    controller: _usernameController,
                    label: 'Username',
                    icon: Icons.person_outline,
                  ).animate().slideX(begin: -0.2, end: 0, delay: 600.ms),

                  const SizedBox(height: 20),

                  // Password Field
                  _buildTextField(
                    controller: _passwordController,
                    label: 'Password',
                    icon: Icons.lock_outline,
                    isPassword: true,
                  ).animate().slideX(begin: 0.2, end: 0, delay: 600.ms),

                  const SizedBox(height: 40),

                  // Login Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        shadowColor: Colors.blueAccent.withOpacity(0.5),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              'Sign In',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.5, end: 0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.grey.shade400),
          prefixIcon: Icon(icon, color: Colors.blueAccent),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ),
        ),
      ),
    );
  }
}
