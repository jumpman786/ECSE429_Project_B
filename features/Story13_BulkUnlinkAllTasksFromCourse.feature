Feature: Toggle course list active flag
  As a student
  I want to archive or reactivate a course todo list
  So I can focus on current courses

  Background:
    Given the server is running
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | ECSE321 | false     | SE          | true   |

  Scenario: Normal - archive an active course
    When the student sets course "ECSE321" active flag to "false"
    Then course "ECSE321" has active flag "false"

  Scenario: Alternate - reactivate an archived course
    When the student sets course "ECSE321" active flag to "false"
    And the student sets course "ECSE321" active flag to "true"
    Then course "ECSE321" has active flag "true"

  Scenario: Error - toggle a non-existing course
    When the student sets course "NOCOURSE" active flag to "false"
    Then the student is notified of a 404 or 400 error
