Feature: Query incomplete tasks for a course
  As a student
  I want to see the incomplete tasks for a course
  So I know what remains

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title           | doneStatus | description |
      | HW1             | false      | problems    |
      | HW2             | true       | submitted   |
      | Project intro   | false      | draft       |
    And course todo list projects with the following details exist
      | title    | completed | description | active |
      | ECSE321  | false     | SE          | true   |
      | ENGL202  | false     | Lit         | true   |
    And the TODO "HW1" is attached to course "ECSE321"
    And the TODO "HW2" is attached to course "ECSE321"
    And the TODO "Project intro" is attached to course "ECSE321"

  Scenario: Normal - returns only undone tasks
    When the student queries incomplete tasks for "ECSE321"
    Then the result contains only tasks with doneStatus "false"
    And the result contains the titles
      | HW1 |
      | Project intro |

  Scenario: Alternate - course has no tasks
    When the student queries incomplete tasks for "ENGL202"
    Then the result is empty

  Scenario: Error - invalid course name
    When the student queries incomplete tasks for "NOCOURSE"
    Then the student is notified of a 404 or 400 error
