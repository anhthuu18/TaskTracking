export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
  TaskList: undefined;
  TaskDetail?: {
    taskId: string;
  };
  AddTask?: undefined;
  EditTask?: {
    taskId: string;
  };
};

export type NavigationProps = {
  navigation: any;
  route: any;
};
