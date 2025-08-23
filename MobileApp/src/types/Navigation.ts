export type RootStackParamList = {
  Splash: undefined;
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
