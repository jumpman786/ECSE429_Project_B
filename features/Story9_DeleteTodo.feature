Feature: Delete a TODO
  As a student
  I want to delete a task
  So I can remove items I no longer need

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title          | doneStatus | description   |
      | Finish webwork | false      | Problem set 3 |
      | Read Act 1     | false      | Shakespeare   |
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | MATH141 | false     | Calc 2      | true   |
    And the TODO "Finish webwork" is attached to course "MATH141"

  Scenario: Normal - delete a TODO that exists and is linked to a course
    When the student deletes TODO "Finish webwork"
    Then the TODO titled "Finish webwork" is no longer present
    And course "MATH141" no longer lists "Finish webwork" among its tasks

  Scenario: Error - delete a TODO by an invalid id
    When the student deletes TODO id "999999"
    Then the student is notified of a 404 or 400 error
