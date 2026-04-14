import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssessmentResultPage } from './assessment-result.page';

describe('AssessmentResultPage', () => {
  let component: AssessmentResultPage;
  let fixture: ComponentFixture<AssessmentResultPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AssessmentResultPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
