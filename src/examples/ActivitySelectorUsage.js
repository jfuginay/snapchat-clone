/**
 * ActivitySelector Usage Examples for TribeFind
 * Shows how to integrate the ActivitySelector component in different scenarios
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import ActivitySelector from '../../components/ActivitySelector';

// Example 1: Basic Activity Selection
export const BasicActivitySelectionExample = () => {
  const [selectedActivities, setSelectedActivities] = useState([]);

  const handleSelectionChange = (activityIds) => {
    setSelectedActivities(activityIds);
    console.log('Selected activities:', activityIds);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Activity Selection</Text>
      <ActivitySelector 
        onSelectionChange={handleSelectionChange}
        showCategories={true}
        allowMultiSelect={true}
      />
      {selectedActivities.length > 0 && (
        <View style={styles.selectionDisplay}>
          <Text style={styles.selectionText}>
            You've selected {selectedActivities.length} activities
          </Text>
        </View>
      )}
    </View>
  );
};

// Example 2: Limited Selection (Onboarding)
export const OnboardingActivitySelectionExample = () => {
  const [selectedActivities, setSelectedActivities] = useState([]);
  const maxSelections = 5;

  const handleSelectionChange = (activityIds) => {
    setSelectedActivities(activityIds);
    
    if (activityIds.length >= maxSelections) {
      Alert.alert(
        'Great choices!', 
        `You've selected ${activityIds.length} activities. This will help us find your tribe!`
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding: Choose Your Top 5 Interests</Text>
      <Text style={styles.subtitle}>
        Help us understand what you're passionate about to connect you with like-minded people
      </Text>
      <ActivitySelector 
        onSelectionChange={handleSelectionChange}
        showCategories={true}
        allowMultiSelect={true}
        maxSelections={maxSelections}
      />
    </View>
  );
};

// Example 3: Category-Specific Selection
export const CategorySpecificExample = () => {
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Sports');

  const categories = ['Sports', 'Creative', 'Technology', 'Outdoor', 'Lifestyle'];

  const handleSelectionChange = (activityIds) => {
    setSelectedActivities(activityIds);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedActivities([]); // Reset selections when category changes
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category-Specific Activity Selection</Text>
      
      {/* Category Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categorySelector}
        contentContainerStyle={styles.categorySelectorContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonSelected
            ]}
            onPress={() => handleCategoryChange(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.categoryButtonTextSelected
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ActivitySelector 
        onSelectionChange={handleSelectionChange}
        showCategories={false}
        allowMultiSelect={true}
        selectedCategory={selectedCategory}
      />
    </View>
  );
};

// Example 4: Single Selection Mode
export const SingleSelectionExample = () => {
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleSelectionChange = (activityIds) => {
    setSelectedActivity(activityIds[0] || null);
    if (activityIds.length > 0) {
      Alert.alert('Activity Selected', 'You can change your selection anytime!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Single Activity Selection</Text>
      <Text style={styles.subtitle}>
        Choose your primary interest for this session
      </Text>
      <ActivitySelector 
        onSelectionChange={handleSelectionChange}
        showCategories={true}
        allowMultiSelect={false}
      />
    </View>
  );
};

// Example 5: Skill-Level Focused View
export const SkillLevelFocusedExample = () => {
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [userSkillData, setUserSkillData] = useState({});

  const handleSelectionChange = (activityIds) => {
    setSelectedActivities(activityIds);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skill Level Assessment</Text>
      <Text style={styles.subtitle}>
        Select activities and indicate your skill level for better tribe matching
      </Text>
      <ActivitySelector 
        onSelectionChange={handleSelectionChange}
        showCategories={true}
        allowMultiSelect={true}
      />
      
      {selectedActivities.length > 0 && (
        <View style={styles.skillSummary}>
          <Text style={styles.skillSummaryTitle}>Your Skill Profile:</Text>
          <Text style={styles.skillSummaryText}>
            🌱 Beginner activities: Learn from others
          </Text>
          <Text style={styles.skillSummaryText}>
            🌿 Intermediate activities: Practice with peers
          </Text>
          <Text style={styles.skillSummaryText}>
            🌳 Advanced activities: Mentor newcomers
          </Text>
        </View>
      )}
    </View>
  );
};

// Example 6: Interest Discovery Flow
export const InterestDiscoveryExample = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [allSelections, setAllSelections] = useState({});
  
  const discoverySteps = [
    { category: 'Sports', title: 'Physical Activities', subtitle: 'What gets your body moving?' },
    { category: 'Creative', title: 'Creative Pursuits', subtitle: 'How do you express yourself?' },
    { category: 'Technology', title: 'Tech Interests', subtitle: 'What technology excites you?' },
    { category: 'Lifestyle', title: 'Lifestyle Choices', subtitle: 'How do you spend your free time?' }
  ];

  const currentStepData = discoverySteps[currentStep];

  const handleSelectionChange = (activityIds) => {
    setAllSelections(prev => ({
      ...prev,
      [currentStepData.category]: activityIds
    }));
  };

  const handleNext = () => {
    if (currentStep < discoverySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete discovery
      const totalSelections = Object.values(allSelections).flat().length;
      Alert.alert(
        'Discovery Complete!', 
        `You've selected ${totalSelections} interests across ${Object.keys(allSelections).length} categories. Time to find your tribe!`
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.discoveryHeader}>
        <Text style={styles.discoveryStep}>
          Step {currentStep + 1} of {discoverySteps.length}
        </Text>
        <Text style={styles.title}>{currentStepData.title}</Text>
        <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
      </View>

      <ActivitySelector 
        onSelectionChange={handleSelectionChange}
        showCategories={false}
        allowMultiSelect={true}
        selectedCategory={currentStepData.category}
        key={currentStepData.category} // Force re-render when category changes
      />

      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext}>
          <Text style={styles.navButtonPrimaryText}>
            {currentStep === discoverySteps.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Example Container
const ActivitySelectorExamples = () => {
  const [currentExample, setCurrentExample] = useState(0);

  const examples = [
    { component: BasicActivitySelectionExample, title: 'Basic Selection' },
    { component: OnboardingActivitySelectionExample, title: 'Onboarding Flow' },
    { component: CategorySpecificExample, title: 'Category Specific' },
    { component: SingleSelectionExample, title: 'Single Selection' },
    { component: SkillLevelFocusedExample, title: 'Skill Assessment' },
    { component: InterestDiscoveryExample, title: 'Interest Discovery' }
  ];

  const CurrentExampleComponent = examples[currentExample].component;

  return (
    <View style={styles.mainContainer}>
      {/* Example Navigator */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.exampleNav}
        contentContainerStyle={styles.exampleNavContent}
      >
        {examples.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.exampleNavButton,
              currentExample === index && styles.exampleNavButtonSelected
            ]}
            onPress={() => setCurrentExample(index)}
          >
            <Text style={[
              styles.exampleNavButtonText,
              currentExample === index && styles.exampleNavButtonTextSelected
            ]}>
              {example.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Example */}
      <CurrentExampleComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  exampleNav: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exampleNavContent: {
    padding: 15,
  },
  exampleNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exampleNavButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  exampleNavButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  exampleNavButtonTextSelected: {
    color: '#FFFFFF',
  },
  selectionDisplay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  categorySelector: {
    marginBottom: 15,
  },
  categorySelectorContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  skillSummary: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  skillSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  skillSummaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
    lineHeight: 20,
  },
  discoveryHeader: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  discoveryStep: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 5,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  navButtonPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  navButtonPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ActivitySelectorExamples; 