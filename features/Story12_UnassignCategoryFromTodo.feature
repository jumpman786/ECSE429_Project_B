Feature: Remove a category from a TODO
  As a student
  I want to clear a priority tag from a task
  So I can reclassify it later

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title | doneStatus | description |
      | HW1   | false      | problems    |
    And a category with title "HIGH" exists
    And a student assigns priority "HIGH" to the todo with title "HW1"

  Scenario: Normal - unassign existing category
    When the student removes category "HIGH" from the todo "HW1"
    Then the todo with title "HW1" is not classified as "HIGH"

  Scenario: Alternate - unassign category that is not linked (idempotent)
    When the student removes category "LOW" from the todo "HW1"
    Then the unassign attempt is acknowledged
