Feature: Prioritize TODOs
  As a student
  I want to tag a task with a priority (LOW/MEDIUM/HIGH)
  So that I can focus my effort

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title                 | doneStatus | description |
      | Work on group project | false      | setup       |
      | Finish webwork        | false      | 3 problems  |
      | Do Shakespeare Reading| false      | Act 1 only  |

  # Normal flows
  Scenario: Assign LOW to an existing TODO
    Given a category with title "LOW" exists
    When a student assigns priority "LOW" to the todo with title "Work on group project"
    Then the todo with title "Work on group project" is now classified as priority "LOW"
    And the student is notified of the completion of the creation operation

  Scenario: Assign MEDIUM to an existing TODO
    Given a category with title "MEDIUM" exists
    When a student assigns priority "MEDIUM" to the todo with title "Finish webwork"
    Then the todo with title "Finish webwork" is now classified as priority "MEDIUM"
    And the student is notified of the completion of the creation operation

  Scenario: Assign HIGH to an existing TODO
    Given a category with title "HIGH" exists
    When a student assigns priority "HIGH" to the todo with title "Do Shakespeare Reading"
    Then the todo with title "Do Shakespeare Reading" is now classified as priority "HIGH"
    And the student is notified of the completion of the creation operation

  # Alternate flows (create category then assign)
  Scenario: Create LOW then assign
    Given the student creates a category with title "LOW"
    When a student assigns priority "LOW" to the todo with title "Work on group project"
    Then the todo with title "Work on group project" is now classified as priority "LOW"
    And the student is notified of the completion of the creation operation

  Scenario: Create HIGH then assign
    Given the student creates a category with title "HIGH"
    When a student assigns priority "HIGH" to the todo with title "Do Shakespeare Reading"
    Then the todo with title "Do Shakespeare Reading" is now classified as priority "HIGH"
    And the student is notified of the completion of the creation operation

  # Error flow
  Scenario: Assign priority to a non-existing TODO
    Given a category with title "HIGH" exists
    And a TODO with id "50" does not exist
    When a student assigns priority "HIGH" to the todo with id "50"
    Then the student is notified of the non-existence error with a message "Could not find thing matching value for id"
