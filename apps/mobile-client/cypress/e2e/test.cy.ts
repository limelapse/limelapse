describe("Basic Tests", () => {
    it("Visits the welcome page", () => {
        cy.visit("/");
        cy.contains("ion-content", "LimeLapse");
        cy.contains("ion-content", "Welcome");
        cy.contains("ion-button", "Start Now");
    });

    it("Visits projects page", () => {
        cy.visit("/projects");
        cy.contains("ion-toolbar", "Projects");
        cy.contains("ion-content", "Fetching projects failed!");
    });

    it("Visits capture page", () => {
        cy.visit("/capture/a88b6584-2d64-4a06-b1a3-fe012216b50f");
        cy.contains("ion-toolbar", "Capture");
        cy.contains("ion-content", "Fetching project failed!");
    });
});
