Feature: Add a TODO to a course todo list
  As a student
  I want to attach tasks to courses
  So I can organize work by course

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title     | doneStatus | description |
      | HW1       | false      | problems    |
      | Project   | false      | initial     |

  Scenario: Normal - add by title into existing course
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | ECSE321 | false     | SE          | true   |
    When a student adds a TODO with title "HW1" to a course todo list with name "ECSE321"
    Then the TODO with title "HW1" is added as a task of the course todo list with name "ECSE321"

  Scenario: Alternate - create course then attach
    When the student creates a course todo list with name "MATH141" and description "Calculus"
    And a student adds a TODO with title "Project" to a course todo list with name "MATH141"
    Then the TODO with title "Project" is added as a task of the course todo list with name "MATH141"

  Scenario: Error - add with non-existing todo id
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | ENGL202 | false     | Lit         | true   |
    When a student adds a TODO with id "999999" to a course todo list with name "ENGL202"
    Then the student is notified of a 404 or 400 error
