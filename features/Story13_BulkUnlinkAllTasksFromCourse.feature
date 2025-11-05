Feature: Clear all tasks from a course list
  As a student
  I want to remove every task from a course list
  So I can reset the list quickly

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title     | doneStatus | description |
      | A1        | false      | hw          |
      | A2        | true       | hw          |
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | ECSE321 | false     | SE          | true   |
    And the TODO "A1" is attached to course "ECSE321"
    And the TODO "A2" is attached to course "ECSE321"

  Scenario: Normal - clear all tasks
    When the student clears all tasks in course "ECSE321"
    Then the course "ECSE321" has no tasks left
