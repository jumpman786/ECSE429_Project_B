Feature: Move a TODO from one course to another
  As a student
  I want to transfer tasks between course lists
  So they live with the right course

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title      | doneStatus | description |
      | Read Act 1 | false      | Shakespeare |
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | MATH141 | false     | Calc 2      | true   |
      | ENGL202 | false     | Lit         | true   |
    And the TODO "Read Act 1" is attached to course "MATH141"

  Scenario: Normal - move from MATH141 to ENGL202
    When the student moves TODO "Read Act 1" from "MATH141" to "ENGL202"
    Then the student is notified of success for move
    And after move, TODO "Read Act 1" is a task of "ENGL202"
    And after move, TODO "Read Act 1" is not a task of "MATH141"

  Scenario: Error - destination course does not exist
    When the student moves TODO "Read Act 1" from "MATH141" to "NOCOURSE"
    Then the student is notified of a 404 or 400 error for move
    And the move failure message mentions a missing course or link
