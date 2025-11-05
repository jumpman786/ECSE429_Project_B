Feature: Remove a TODO from a course todo list
  As a student
  I want to detach a task from a course
  So I can keep lists accurate

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title          | doneStatus | description   |
      | Finish webwork | false      | Problem set 3 |
      | Read Act 1     | false      | Shakespeare   |
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | MATH141 | false     | Calc 2      | true   |
      | ECSE321 | false     | SE          | true   |

  Scenario: Normal - remove from one course
    And the TODO "Finish webwork" is attached to course "MATH141"
    And the TODO "Finish webwork" is also attached to course "ECSE321"
    When the student removes TODO "Finish webwork" from "MATH141"
    Then TODO "Finish webwork" is no longer a task of "MATH141"
    And TODO "Finish webwork" is still a task of "ECSE321"

  Scenario: Alternate - remove from the other course
    And the TODO "Finish webwork" is attached to course "MATH141"
    And the TODO "Finish webwork" is also attached to course "ECSE321"
    When the student removes TODO "Finish webwork" from "ECSE321"
    Then TODO "Finish webwork" is no longer a task of "ECSE321"
    And TODO "Finish webwork" is still a task of "MATH141"

  Scenario: Error - removing a task not linked to the course
    And the TODO "Finish webwork" is attached to course "MATH141"
    And the TODO "Finish webwork" is also attached to course "ECSE321"
    When the student removes TODO "Read Act 1" from "MATH141"
    Then the student is notified of a 404 or 400 error
