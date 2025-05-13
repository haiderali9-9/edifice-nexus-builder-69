
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { resetDatabase, supabase } from '@/lib/supabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!password) {
      toast({
        title: 'Password Required',
        description: 'Please enter your password.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Regular sign in for all users
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: 'Error signing in',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      navigate('/');
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: 'Error signing in',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validatePassword(password)) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: window.location.origin + '/auth'
        }
      });
      
      if (error) {
        toast({
          title: 'Error creating account',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: 'Verification Email Sent!',
        description: 'Please check your inbox and verify your email. After verification, an administrator will need to approve your account.',
        duration: 6000,
      });

      setActiveTab('login');
      
    } catch (error: any) {
      toast({
        title: 'Error creating account',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset the database? This will delete all data.')) {
      setIsResetting(true);
      try {
        const result = await resetDatabase();
        if (result.success) {
          toast({
            title: 'Database Reset',
            description: 'Database has been reset successfully.',
            variant: 'success',
          });
        } else {
          toast({
            title: 'Reset Failed',
            description: result.message || 'Failed to reset database.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Reset Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
        console.error('Reset error:', error);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Building className="h-10 w-10 text-construction-700" />
            <div>
              <h1 className="font-bold text-2xl tracking-tight text-construction-700">Edifice</h1>
              <p className="text-sm text-gray-500">Construction Management</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your email and password to access your dashboard.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="yourname@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-construction-600 hover:bg-construction-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Create a new account to get started with Edifice.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input 
                        id="firstName" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input 
                        id="lastName" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Email</Label>
                    <Input 
                      id="registerEmail" 
                      type="email" 
                      placeholder="yourname@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Password</Label>
                    <Input 
                      id="registerPassword" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-construction-600 hover:bg-construction-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Database Button - small and in the corner */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs opacity-60 hover:opacity-100"
            onClick={handleResetDatabase}
            disabled={isResetting}
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            {isResetting ? 'Resetting...' : 'Reset Database'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
