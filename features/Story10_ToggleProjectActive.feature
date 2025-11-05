Feature: Toggle a course list's active flag
  As a student
  I want to activate/deactivate a course task list
  So I can hide courses I’m not using

  Background:
    Given the server is running
    And course todo list projects with the following details exist
      | title   | completed | description | active |
      | ECSE321 | false     | SE          | true   |

  Scenario: Normal - deactivate a course
    When the student sets course "ECSE321" active to "false"
    Then course "ECSE321" has active "false"

  Scenario: Normal - reactivate a course
    When the student sets course "ECSE321" active to "true"
    Then course "ECSE321" has active "true"
