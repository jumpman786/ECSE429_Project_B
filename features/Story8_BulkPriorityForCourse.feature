Feature: Bulk priority tagging for a course
  As a student
  I want to set the same priority on all tasks in a course list
  So that the course workload is consistently prioritized

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title             | doneStatus | description |
      | Lab 1             | false      | circuits    |
      | Project proposal  | false      | draft       |
    And course todo list projects with the following details exist
      | title    | completed | description | active |
      | ECSE321  | false     | SE          | true   |
      | EMPTY101 | false     | empty       | true   |
    And the TODO "Lab 1" is attached to course "ECSE321"
    And the TODO "Project proposal" is attached to course "ECSE321"

  Scenario: Normal - set HIGH across all tasks
    Given a category with title "HIGH" exists
    When the student sets the priority "HIGH" on all tasks in "ECSE321"
    Then every task in "ECSE321" is classified as priority "HIGH"

  Scenario: Alternate - create LOW then apply
    Given the student creates a category with title "LOW"
    When the student sets the priority "LOW" on all tasks in "ECSE321"
    Then every task in "ECSE321" is classified as priority "LOW"

  Scenario: Error - course has no tasks
    Given a category with title "HIGH" exists
    When the student sets the priority "HIGH" on all tasks in "EMPTY101"
    Then the student is notified that no tasks were updated in "EMPTY101"
