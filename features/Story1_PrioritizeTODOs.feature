Feature: Prioritize TODOs with categories
  As a student
  I want to tag tasks with priorities
  So I can focus on what matters

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title        | doneStatus | description  |
      | Read Act 1   | false      | Shakespeare  |
      | Submit lab   | true       | already done |
    And a category with title "HIGH" exists

  Scenario: Normal - assign priority to a todo by title
    When a student assigns priority "HIGH" to the todo with title "Read Act 1"
    Then the todo with title "Read Act 1" is now classified as priority "HIGH"
    And the student is notified of the completion of the creation operation

  Scenario: Alternate - assign by non-existing id
    Given a TODO with id "999999" does not exist
    When a student assigns priority "HIGH" to the todo with id "999999"
    Then the student is notified of a 404 or 400 error
