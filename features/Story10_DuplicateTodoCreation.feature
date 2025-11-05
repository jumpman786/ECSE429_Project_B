Feature: Duplicate TODO creation handling
  As a student
  I want protection against creating duplicate TODOs
  So I don't clutter my list

  Background:
    Given the server is running

  Scenario: Normal - creating two different TODOs works
    And TODOs with the following details exist
      | title      | doneStatus | description  |
      | HW1        | false      | problems     |
    When the student creates a TODO titled "HW2" with description "reading"
    Then a TODO titled "HW2" exists

  Scenario: Alternate - creating the same TODO twice returns a handled response
    And TODOs with the following details exist
      | title      | doneStatus | description  |
      | HW1        | false      | problems     |
    When the student creates a TODO titled "HW1" with description "dup try"
    Then the creation is accepted or gracefully rejected as duplicate

  Scenario: Error - creating a TODO without a title
    When the student creates a TODO with an invalid payload
    Then the student is notified of a 404 or 400 error
