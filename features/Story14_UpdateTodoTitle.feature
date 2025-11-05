Feature: Update TODO title
  As a student
  I want to rename a task
  So the title reflects current work

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title        | doneStatus | description |
      | Draft report | false      | write       |

  Scenario: Normal - change title
    When the student renames TODO "Draft report" to "Report v1"
    Then a TODO titled "Report v1" exists
    And no TODO titled "Draft report" remains
