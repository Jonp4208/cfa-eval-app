import { useMemo } from 'react';
import { Employee } from '../types';

const useTrainingData = (employees: Employee[]) => {
  const totalEmployees = useMemo(() => employees.length, [employees]);

  const employeesInTraining = useMemo(
    () => employees.filter((employee) => employee.trainingPlan).length,
    [employees]
  );

  const completedTrainings = useMemo(
    () =>
      employees.filter((employee) =>
        employee.moduleProgress.every((module) => module.completed)
      ).length,
    [employees]
  );

  const departmentProgress = useMemo(() => {
    const progress: { [key: string]: { total: number; completed: number } } = {};

    employees.forEach((employee) => {
      if (progress[employee.department]) {
        progress[employee.department].total++;
        if (employee.moduleProgress.every((module) => module.completed)) {
          progress[employee.department].completed++;
        }
      } else {
        progress[employee.department] = {
          total: 1,
          completed: employee.moduleProgress.every((module) => module.completed) ? 1 : 0,
        };
      }
    });

    return progress;
  }, [employees]);

  const upcomingTrainings = useMemo(
    () =>
      employees
        .filter((employee) => employee.trainingPlan && new Date(employee.trainingPlan.startDate) > new Date())
        .sort((a, b) => new Date(a.trainingPlan!.startDate).getTime() - new Date(b.trainingPlan!.startDate).getTime()),
    [employees]
  );

  const overallProgress = useMemo(() => {
    const totalModules = employees.reduce((total, employee) => total + employee.moduleProgress.length, 0);
    const completedModules = employees.reduce(
      (completed, employee) => completed + employee.moduleProgress.filter((module) => module.completed).length,
      0
    );

    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  }, [employees]);

  return {
    totalEmployees,
    employeesInTraining,
    completedTrainings,
    departmentProgress,
    upcomingTrainings,
    overallProgress,
  };
};

export default useTrainingData; 